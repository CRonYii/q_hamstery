import { CheckCircleTwoTone } from '@ant-design/icons';
import React from 'react';

import { Badge } from 'antd';
import { INumberOfEpisodes } from '../../app/entities';


const EpisodeNumberBadge: React.FC<{ episode_stats?: INumberOfEpisodes, children: any }> = ({ episode_stats, children }) => {
    if (!episode_stats) {
        return <Badge>
            {children}
        </Badge>
    } else if (episode_stats.missing === 0) {
        return <Badge count={<CheckCircleTwoTone twoToneColor="#52c41a" />}>
            {children}
        </Badge>
    } else {
        return <Badge count={episode_stats.missing}>
                {children}
        </Badge>
    }

}

export default EpisodeNumberBadge