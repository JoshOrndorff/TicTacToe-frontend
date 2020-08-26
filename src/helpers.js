
/**
 * Calculates which player has won, and where they have won.
 * This code is nearly identical to that of the runtime, but because it
 * is only run locally, it is fine to do the expensive search after each
 * and every turn. The result will be found here, and verified on chain.
 * @param potentialWinner The player who may have won
 * @param squares The array of squares in the game
 * @return A pair (winnerAddress, Location) or null
 */
export function calculateWin(potentialWinner, squares) {
  let where;

  where = checkDownhill(potentialWinner, squares);
  if (where) {
    return where;
  }

  where = checkUphill(potentialWinner, squares);
  if (where) {
    return where;
  }

  where = checkRows(potentialWinner, squares);
  if (where) {
    return where;
  }

  where = checkColumns(potentialWinner, squares);
  if (where) {
    return where;
  }

  return null;
}

function checkDownhill(potentialWinner, squares) {
  const size = Math.sqrt(squares.length);

  for (let i = 0; i < size; i++) {
    let cell = i * (size + 1);
    if (squares[cell] !== potentialWinner) {
      return null;
    }
  }

  return "Downhill";
}

function checkUphill(potentialWinner, squares) {
  const size = Math.sqrt(squares.length);

  for (let i = 0; i < size; i++) {
    let cell = (i + 1) * (size - 1);
    if (squares[cell] !== potentialWinner) {
      return null;
    }
  }

  return "Uphill";
}

function checkRows(potentialWinner, squares) {
  const size = Math.sqrt(squares.length);

  for (let row = 0; row < size; row++) {
    let won = true;

    for (let col = 0; col < size; col++) {
      let cell = row * size + col;
      if (squares[cell] !== potentialWinner) {
        won = false;
        break;
      }
    }

    if (won) {
      return { "Row": row };
    }
  }

  return null
}

function checkColumns(potentialWinner, squares) {
  const size = Math.sqrt(squares.length);

  for (let col = 0; col < size; col++) {
    let won = true;

    for (let row = 0; row < size; row++) {
      let cell = row * size + col;
      if (squares[cell] !== potentialWinner) {
        won = false;
        break;
      }
    }

    if (won) {
      return { "Column": col };
    }
  }

  return null;
}

export function isBoardFull(squares) {
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === "") {
      return false;
    }
  }
  return true;
}
