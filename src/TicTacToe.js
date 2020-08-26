import React, { useEffect, useState } from "react";
import { Container, Grid, Input, Button, Card } from "semantic-ui-react";
import Identicon from '@polkadot/react-identicon';
import Square from './Square';
import { TxButton } from './substrate-lib/components';
import { useSubstrate } from './substrate-lib';
import { calculateWin, isBoardFull } from "./helpers";

export default function Main({accountPair}) {
  const { api } = useSubstrate();

  const numPlayers = 2; // For now hardcode number of players to 2
  const boardSize = 3; // For now hardcode board size to 3

  const [ gameId, setGameId ] = useState(0);
  const [ squares, setSquares ] = useState(Array(boardSize ** 2).fill(null));
  const [ turn, setTurn ] = useState(0);
  const [ players, setPlayers] = useState([]);
  const [ transactionStatus, setTransactionStatus ] = useState(null);
  const [ loadGameField, setLoadGameField ] = useState(0);
  const [ opponentField, setOpponentField ] = useState();
  window.players = players;

  // Read the players and number of turns taken from the blockchain
  useEffect(() => {
    let unsubscribe;
    api.queryMulti([
      [api.query.ticTacToe.players, gameId],
      [api.query.ticTacToe.turn, gameId],
    ], ([players, turn]) => {
      setPlayers(players.map((p) => p.toString()));
      setTurn(turn);
    })
      .then(u => {unsubscribe = u;})
      .catch(console.error);

    return () => unsubscribe && unsubscribe();
  }, [api, api.query.ticTacToe, gameId]);

  // Read the square states from the blockchain
  // TODO Should/could this be combined with the previous effect
  useEffect(() => {
    let unsubscribeAll;

    // Build up list of cells to query [[gameId, 0], [gameId, 1], ...]
    let cells = [];
    for (let i = 0; i < boardSize ** 2; i++) {
      cells.push([gameId, i]);
    }

    // Subscribe to all cells in the game
    api.query.ticTacToe.board.multi(cells, (result) => {
      const squares = result.map(x => x.toString())
      setSquares(squares);
    })
      .then(u => {unsubscribeAll = u;})
      .catch(console.error);

    return () => unsubscribeAll && unsubscribeAll();
  }, [gameId, api.query.ticTacToe]);

  function gameStatus() {
    if (players.length === 0) {
      return `No game with id ${gameId}`;
    // } else if (winner) {
    //   return `${winner} wins at ${winLocation}`;
    } else if (isBoardFull(squares)) {
      return "Draw!";
    } else {
      return "Next player: " + players[turn % numPlayers];
    }
  }

  function renderSquare(i) {
    return <Square
      value={squares[i]}
      disabled={
        // Account is specified
        !accountPair ||
        // It's your turn
        accountPair.address !== players[turn % numPlayers] ||
        // Square is available
        squares[i] !== "" ||
        // Game isn't over
        players.length === 0
      }
      moveHere={
        // Create a function that stores square state as a closure
        moveAtSquare(i)
      }
    />
  }

  /**
   * Create a function that will submit a move at the specified location
   * @param i the square that will be moved at if the result is called.
   * @return a function that will make a move (and claim win if
   * appropriate) at the specified lovation
   */
  function moveAtSquare(i) {
    return () => {
      let newSquares = squares.slice();
      newSquares[i] = accountPair.address;

      const winLocation = calculateWin(accountPair.address, newSquares);

      console.log("winLocation is");
      console.log(winLocation);
      console.log(!!winLocation);
      const txCall = winLocation
        ? api.tx.ticTacToe.takeWinningTurn(gameId, i, winLocation)
        : api.tx.ticTacToe.takeNormalTurn(gameId, i);

      txCall.signAndSend(accountPair, ({ status }) => {
        if (status.isFinalized) {
          setTransactionStatus(
            `Completed at block hash #${status.asFinalized.toString()}`
          );
          // Clear the status after a 2 second timeout
          setTimeout(() => {
            setTransactionStatus(null);
          }, 2000);
        } else {
          setTransactionStatus(`Current transaction status: ${status.type}`);
        }
      })
      .catch(e => {
        setTransactionStatus(":( transaction failed");
        console.error("ERROR:", e);
      });
    }
  }

  return (
    <Container>
      <Grid columns="equal">
        <Grid.Row>
          <Grid.Column>
            <Card>
              <Card.Content>
                <Input
                  onChange={(_, {value}) => { setLoadGameField(value); }}
                  label="Game ID"
                  fluid
                  placeholder="123"
                  state="gameId"
                  type="number"
                />
              </Card.Content>
              <Card.Content extra>
                <Button primary onClick={() => {setGameId(loadGameField)}}>
                  <p>Load Game</p>
                </Button>
              </Card.Content>
            </Card>
          </Grid.Column>
          <Grid.Column>
          <Card>
            <Card.Content>
              <Input
                onChange={(_, {value}) => { setOpponentField(value); }}
                label="Opponent"
                fluid
                placeholder="address"
                type="text"
              />
            </Card.Content>
            <Card.Content extra>
            <TxButton
              accountPair={accountPair}
              label="Create New Game"
              type='SIGNED-TX'
              tx={api.tx.ticTacToe.createGame}
              setStatus={setTransactionStatus}
              attrs={{
                palletRpc: 'ticTacToe',
                callable: 'createGame',
                inputParams: [opponentField],
                paramFields: [true]
              }}
            />
            </Card.Content>
          </Card>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <h1>{`Game: ${gameId}`}</h1>
          </Grid.Column>
          <Grid.Column>
            <span>Players:</span>
            <Identicon account={players[0]} size={48} />
            <Identicon account={players[1]} size={48} />
          </Grid.Column>
        </Grid.Row>
        {/* TODO how to not hardcode this rendering */}
        {/* https://stackoverflow.com/questions/22876978/loop-inside-react-jsx */}
        <Grid.Row>
          {renderSquare(0)}
          {renderSquare(1)}
          {renderSquare(2)}
        </Grid.Row>
        <Grid.Row>
          {renderSquare(3)}
          {renderSquare(4)}
          {renderSquare(5)}
        </Grid.Row>
        <Grid.Row>
          {renderSquare(6)}
          {renderSquare(7)}
          {renderSquare(8)}
        </Grid.Row>
      </Grid>
      <div className="game-info">{transactionStatus !== null ? transactionStatus : gameStatus()}</div>
    </Container>
  );
}
