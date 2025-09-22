import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Helper to get initials from a name
const getInitials = (name?: string): string => {
  if (!name) {
    return "?";
  }
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const countOccurrences = (arr: number[]): Record<number, number> => {
  return arr.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
};

/**
 * Triggered on any write to the 'draws' collection.
 * It recalculates the top 5 ranking tickets and saves them to a public document.
 */
export const updatePublicRanking = functions.region("southamerica-east1").firestore
    .document("draws/{drawId}")
    .onWrite(async (change, context) => {
      try {
        // 1. Get all current draws
        const drawsSnapshot = await db.collection("draws").get();
        if (drawsSnapshot.empty) {
          // If all draws are deleted, clear the ranking
          await db.doc("configs/publicRanking").set({ranking: []});
          functions.logger.info("No draws found, public ranking cleared.");
          return;
        }
        
        // Create a mutable frequency map of all drawn numbers
        const drawnNumbersFrequency = countOccurrences(
            drawsSnapshot.docs.flatMap((doc) => doc.data().numbers)
        );

        // 2. Get all active tickets
        const ticketsSnapshot = await db.collection("tickets")
            .where("status", "==", "active").get();
        const activeTickets = ticketsSnapshot.docs.map((doc) => doc.data());

        // 3. Calculate matches for each ticket using the correct logic
        const ticketsWithMatches = activeTickets.map((ticket) => {
          let matches = 0;
          // Create a copy of the drawn numbers frequency map for each ticket calculation
          const availableDraws = {...drawnNumbersFrequency};
          
          // Iterate through each number in the ticket
          for (const num of ticket.numbers) {
            // If the number exists in the available draws and its count is > 0
            if (availableDraws[num] && availableDraws[num] > 0) {
              matches++; // We have a match
              availableDraws[num]--; // Decrement the count for this number
            }
          }
          
          return {
            ...ticket,
            matches,
          };
        });

        // 4. Sort and get top 5
        const topTickets = ticketsWithMatches
            .filter((ticket) => ticket.matches > 0)
            .sort((a, b) => b.matches - a.matches)
            .slice(0, 5);

        // 5. Anonymize data for public consumption
        const publicRanking = topTickets.map((ticket) => ({
          initials: getInitials(ticket.buyerName),
          matches: ticket.matches,
          ticketId: ticket.id.substring(0, 4), // Obfuscated ID
        }));

        // 6. Save to a public-readable document
        await db.doc("configs/publicRanking").set({
          ranking: publicRanking,
          lastUpdated: new Date().toISOString(),
        });

        functions.logger.info("Public ranking updated successfully.",
            {count: publicRanking.length});
      } catch (error) {
        functions.logger.error("Error updating public ranking:", error);
        // Optionally, re-throw the error to indicate a failure
        // that might require a retry.
        throw new functions.https.HttpsError("internal",
            "Failed to update public ranking.", error);
      }
    });
