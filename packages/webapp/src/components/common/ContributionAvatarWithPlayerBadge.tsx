
import { Avatar, AvatarProps, Badge } from '@mui/material';

interface Props {
  playerID: string;
  contributions: number;
  sizes?: AvatarProps['sizes'];
}

const ContributionAvatarWithPlayerBadge: React.FC<Props> = ({ playerID, contributions, sizes }) => (
  <Badge anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent={playerID}>
    <Avatar sizes={sizes}>{contributions}</Avatar>
  </Badge>
);

export default ContributionAvatarWithPlayerBadge;
