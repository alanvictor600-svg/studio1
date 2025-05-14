// src/lib/lottery-utils.ts
import type { Ticket, Draw } from '@/types';

export const animalMapping = [
  { number: 1, name: "Avestruz", hint: "ostrich" },
  { number: 2, name: "Águia", hint: "eagle" },
  { number: 3, name: "Burro", hint: "donkey" },
  { number: 4, name: "Borboleta", hint: "butterfly" },
  { number: 5, name: "Cachorro", hint: "dog" },
  { number: 6, name: "Cabra", hint: "goat" },
  { number: 7, name: "Carneiro", hint: "ram" },
  { number: 8, name: "Camelo", hint: "camel" },
  { number: 9, name: "Cobra", hint: "snake" },
  { number: 10, name: "Coelho", hint: "rabbit" },
  { number: 11, name: "Cavalo", hint: "horse" },
  { number: 12, name: "Elefante", hint: "elephant" },
  { number: 13, name: "Galo", hint: "rooster" },
  { number: 14, name: "Gato", hint: "cat" },
  { number: 15, name: "Jacaré", hint: "alligator" },
  { number: 16, name: "Leão", hint: "lion" },
  { number: 17, name: "Macaco", hint: "monkey" },
  { number: 18, name: "Porco", hint: "pig" },
  { number: 19, name: "Pavão", hint: "peacock" },
  { number: 20, name: "Peru", hint: "turkey bird" }, // "turkey" might give Thanksgiving turkey
  { number: 21, name: "Touro", hint: "bull" },
  { number: 22, name: "Tigre", hint: "tiger" },
  { number: 23, name: "Urso", hint: "bear" },
  { number: 24, name: "Veado", hint: "deer" },
  { number: 25, name: "Vaca", hint: "cow" },
];

export function generateAutoFilledTicket(): number[] {
  const ticket: number[] = [];
  const counts: Record<number, number> = {};
  // All numbers from 1 to 25 are candidates for each pick.
  const allPossibleNumbers = Array.from({ length: 25 }, (_, i) => i + 1);

  while (ticket.length < 10) {
    const randomIndex = Math.floor(Math.random() * allPossibleNumbers.length);
    const num = allPossibleNumbers[randomIndex];

    if ((counts[num] || 0) < 4) {
      ticket.push(num);
      counts[num] = (counts[num] || 0) + 1;
    }
    // If a number cannot be added because its count is 4,
    // the loop continues and picks another random number from allPossibleNumbers.
    // This is acceptable given the constraints (10 picks, max 4 per number from 25 options).
  }
  return ticket.sort((a, b) => a - b);
}

export function countOccurrences(arr: number[]): Record<number, number> {
  return arr.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
}

export function updateTicketStatusesBasedOnDraws(tickets: Ticket[], draws: Draw[]): Ticket[] {
  if (!Array.isArray(tickets)) {
    console.error("updateTicketStatusesBasedOnDraws: tickets is not an array", tickets);
    return [];
  }
  if (!Array.isArray(draws)) {
    console.error("updateTicketStatusesBasedOnDraws: draws is not an array", draws);
    // If draws are invalid, process tickets as if there are no draws
    return tickets.map(ticket => ({
      ...ticket,
      status: ticket.status === 'winning' ? 'active' : ticket.status,
    }));
  }

  if (draws.length === 0) {
    // If there are no draws, no ticket can be winning.
    // If a ticket was previously 'winning', reset it to 'active'.
    return tickets.map(ticket => ({
      ...ticket,
      status: ticket.status === 'winning' ? 'active' : ticket.status,
    }));
  }

  const allDrawnNumbersFlattened: number[] = draws.flatMap(draw => draw.numbers);
  const drawnNumbersFrequency = countOccurrences(allDrawnNumbersFlattened);

  return tickets.map(ticket => {
    if (!ticket || !Array.isArray(ticket.numbers)) {
      console.error("updateTicketStatusesBasedOnDraws: invalid ticket encountered", ticket);
      return { ...ticket, status: 'expired' }; // Or some default error state
    }

    const ticketNumbersFrequency = countOccurrences(ticket.numbers);
    let isCurrentlyWinning = true;

    if (ticket.numbers.length !== 10) { 
      isCurrentlyWinning = false;
    } else {
      for (const numStr in ticketNumbersFrequency) {
        const num = parseInt(numStr, 10);
        const countInTicket = ticketNumbersFrequency[num];
        const countInDraws = drawnNumbersFrequency[num] || 0;
        if (countInDraws < countInTicket) {
          isCurrentlyWinning = false;
          break;
        }
      }
    }

    let newStatus = ticket.status;
    if (isCurrentlyWinning) {
      newStatus = 'winning';
    } else {
      // If it's not currently winning, but its status was 'winning', revert it.
      // Otherwise, keep its existing non-winning status (e.g., 'active', 'expired').
      if (ticket.status === 'winning') {
        newStatus = 'active'; 
      }
    }
    return { ...ticket, status: newStatus };
  });
}
