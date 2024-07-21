import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { getSelectedJobSlots, toggleJobSlotSelection } from '@/lib/reducers/jobSlotSlice';
import { Avatar } from '../../common/Avatar';

type JobCardProps = {
  id: string;
  title: string;
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  border: '1px solid black',
  cursor: 'pointer',
  padding: '16px',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.selected': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const JobCard: React.FC<JobCardProps> = ({ id, title }) => {
  const dispatch = useAppDispatch();
  const selectedCards = useAppSelector(getSelectedJobSlots);
  const selected = !!selectedCards[id];

  const handleSelect = () => {
    dispatch(toggleJobSlotSelection(id));
  };

  return (
    <StyledPaper onClick={handleSelect} className={selected ? 'selected' : ''}>
      <Avatar title={title} />
      <Typography style={{ marginLeft: '16px' }} variant="h6">{title}</Typography>
    </StyledPaper>
  );
};

export default JobCard;
