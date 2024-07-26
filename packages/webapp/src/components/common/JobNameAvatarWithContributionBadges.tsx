import { Avatar, Size } from '@/components/common/Avatar';
import { Badge } from '@mui/material';

interface Props {
  jobTitle: string;
  requirements: number;
  totalContributions?: number;
  size?: Size;
}

const JobNameAvatarWithContributionBadges: React.FC<Props> = ({ jobTitle, requirements, totalContributions = 0, size }) => (
  <Badge anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} overlap='circular' badgeContent={totalContributions} color='secondary'>
    <Badge anchorOrigin={{ vertical: 'top', horizontal: 'right' }} overlap='circular' badgeContent={requirements} color="primary">
      <Avatar size={size} title={jobTitle} />
    </Badge>
  </Badge>
);

export default JobNameAvatarWithContributionBadges;
