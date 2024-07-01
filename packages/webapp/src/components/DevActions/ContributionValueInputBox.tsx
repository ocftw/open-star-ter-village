import { Box, Stack, TextField } from "@mui/material";
import React from "react";

interface Props {
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ContributionValueInputBox: React.FC<Props> = ({ value, onChange }) => (
  <Stack direction="row" spacing={2}>
    <Box component='label'>Value</Box>
    <TextField
      type="number"
      InputProps={{ inputProps: { min: 0, max: 5 } }}
      value={value}
      onChange={onChange}
    />
  </Stack>
);

export default ContributionValueInputBox;
