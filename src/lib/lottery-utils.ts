
// src/lib/lottery-utils.ts
import type { Ticket, Draw } from '@/types';

export const animalMapping = [
  { number: 1, name: "Avestruz", emoji: "🐦" },
  { number: 2, name: "Águia", emoji: "🦅" },
  { number: 3, name: "Burro", emoji: "🐴" },
  { number: 4, name: "Borboleta", emoji: "🦋" },
  { number: 5, name: "Cachorro", emoji: "🐶" },
  { number: 6, name: "Cabra", emoji: "🐐" },
  { number: 7, name: "Carneiro", emoji: "🐑" },
  { number: 8, name: "Camelo", emoji: "🐪" },
  { number: 9, name: "Cobra", emoji: "🐍" },
  { number: 10, name: "Coelho", emoji: "🐰" },
  { number: 11, name: "Cavalo", emoji: "🐎" },
  { number: 12, name: "Elefante", emoji: "🐘" },
  { number: 13, name: "Galo", emoji: "🐔" },
  { number: 14, name: "Gato", emoji: "🐈" },
  { number: 15, name: "Jacaré", emoji: "🐊" },
  { number: 16, name: "Leão", emoji: "🦁" },
  { number: 17, name: "Macaco", emoji: "🐒" },
  { number: 18, name: "Porco", emoji: "🐷" },
  { number: 19, name: "Pavão", emoji: "🦚" },
  { number: 20, name: "Peru", emoji: "🦃" },
  { number: 21, name: "Touro", emoji: "🐂" },
  { number: 22, name: "Tigre", emoji: "🐅" },
  { number: 23, name: "Urso", emoji: "🐻" },
  { number: 24, name: "Veado", emoji: "🦌" },
  { number: 25, name: "Vaca", emoji: "🐄" },
];

export function generateAutoFilledTicket(): number[] {
  const ticket: number[] = [];
  const counts: Record<number, number> = {};
  const allPossibleNumbers = Array.from({ length: 25 }, (_, i) => i + 1);

  while (ticket.length < 10) {
    const randomIndex = Math.floor(Math.random() * allPossibleNumbers.length);
    const num = allPossibleNumbers[randomIndex];

    if ((counts[num] || 0) < 4) {
      ticket.push(num);
      counts[num] = (counts[num] || 0) + 1;
    }
  }
  return ticket.sort((a, b) => a - b);
}

export function countOccurrences(arr: number[]): Record<number, number> {
  return arr.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
}

export function calculateTicketMatches(ticket: Ticket, draws: Draw[]): number {
    if (!draws || draws.length === 0 || (ticket.status !== 'active' && ticket.status !== 'winning')) {
        return 0;
    }

    const drawnNumbersFrequency = countOccurrences(draws.flatMap(draw => draw.numbers));
    const ticketNumbersFrequency = countOccurrences(ticket.numbers);

    let matches = 0;

    for (const numStr in ticketNumbersFrequency) {
        const num = parseInt(numStr, 10);
        const countInTicket = ticketNumbersFrequency[num];
        const countInDraws = drawnNumbersFrequency[num] || 0;
        
        matches += Math.min(countInTicket, countInDraws);
    }

    return matches;
}

export function updateTicketStatusesBasedOnDraws(tickets: Ticket[], draws: Draw[]): Ticket[] {
  if (!Array.isArray(tickets)) {
    console.error("updateTicketStatusesBasedOnDraws: tickets is not an array", tickets);
    return [];
  }
  if (!Array.isArray(draws)) {
    console.error("updateTicketStatusesBasedOnDraws: draws is not an array", draws);
    return tickets.filter(Boolean).map(ticket => {
        if (ticket.status === 'awaiting_payment' || ticket.status === 'unpaid') return ticket;
        return {...ticket, status: ticket.status === 'winning' ? 'active' : ticket.status };
    });
  }

  if (draws.length === 0) {
    return tickets.filter(Boolean).map(ticket => {
      if (ticket.status === 'winning') return { ...ticket, status: 'active' };
      return ticket;
    });
  }

  const allDrawnNumbersFlattened: number[] = draws.flatMap(draw => (draw && Array.isArray(draw.numbers)) ? draw.numbers : []);
  const drawnNumbersFrequency = countOccurrences(allDrawnNumbersFlattened);

  return tickets.filter(Boolean).map(ticket => {
    if (ticket.status !== 'active' && ticket.status !== 'winning') {
      return ticket;
    }
    
    if (!Array.isArray(ticket.numbers)) {
      console.error("updateTicketStatusesBasedOnDraws: invalid ticket encountered", ticket);
      return { ...ticket, status: 'expired' };
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
      if (ticket.status === 'winning') {
        newStatus = 'active'; 
      }
    }
    return { ...ticket, status: newStatus };
  });
}
