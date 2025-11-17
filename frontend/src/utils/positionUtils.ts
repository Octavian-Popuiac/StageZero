export function insertCompetitorWithCascade(
  positions: { position: number; competitor: any | null }[],
  competitor: any,
  targetPosition: number
) {
  const index = targetPosition - 1;
  if (!positions[index].competitor) {
    // Se está livre, só coloca
    const newPositions = positions.map(p => ({ ...p }));
    newPositions[index].competitor = competitor;
    return newPositions;
  }

  // Procura para baixo
  let freeIndex = -1;
  for (let i = index + 1; i < positions.length; i++) {
    if (!positions[i].competitor) {
      freeIndex = i;
      break;
    }
  }
  // Se não encontrou para baixo, procura para cima
  if (freeIndex === -1) {
    for (let i = index - 1; i >= 0; i--) {
      if (!positions[i].competitor) {
        freeIndex = i;
        break;
      }
    }
  }
  if (freeIndex === -1) return positions; // Não há vagas (não deve acontecer)

  const newPositions = positions.map(p => ({ ...p }));

  if (freeIndex > index) {
    // Move todos para baixo
    for (let i = freeIndex; i > index; i--) {
      newPositions[i].competitor = newPositions[i - 1].competitor;
    }
    newPositions[index].competitor = competitor;
  } else {
    // Move todos para cima
    for (let i = freeIndex; i < index; i++) {
      newPositions[i].competitor = newPositions[i + 1].competitor;
    }
    newPositions[index].competitor = competitor;
  }

  return newPositions;
}