import React from "react";
import { Grid, Card, Button } from "semantic-ui-react";
import Identicon from '@polkadot/react-identicon';

export default function Square({
  value,
  disabled,
  moveHere,
}) {

  return (
    <Grid.Column>
      <Card>
        <Card.Content textAlign="center">
          <Identicon value={value} size={48} />
        </Card.Content>
        <Card.Content extra textAlign="center">
          <Button
            onClick={moveHere}
            primary type="submit"
            disabled={disabled}>
              Move Here
          </Button>
        </Card.Content>
      </Card>
    </Grid.Column>
  );
}
