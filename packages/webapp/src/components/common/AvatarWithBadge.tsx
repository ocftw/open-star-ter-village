import { Avatar, Size } from '@/components/common/Avatar';
import { Badge } from '@mui/material';

export const AvatarWithBadge: React.FC<{ avatarTitle: string; badgeContent: number; avatarSize?: Size }> = ({ avatarTitle, badgeContent, avatarSize }) => (
  <Badge anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} overlap='circular' badgeContent={badgeContent} color="primary">
    <Avatar size={avatarSize} title={avatarTitle} />
  </Badge>
);
