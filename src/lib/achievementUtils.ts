
export const getAchievementTitle = (type: string, level: number): string => {
  if (type === 'courses') {
    switch (level) {
      case 1: return 'Rookie Creator';
      case 2: return 'Content Crafter';
      case 3: return 'Course Master';
      case 4: return 'Course Sage';
      case 5: return 'Knowledge Artisan';
      case 6: return 'Education Architect';
      case 7: return 'Learning Legend';
      case 8: return 'Grand Instructor';
      default: return 'Creator Achievement';
    }
  } else if (type === 'students') {
    switch (level) {
      case 1: return 'Student Spark';
      case 2: return 'Rising Mentor';
      case 3: return 'Student Master';
      case 4: return 'Audience Builder';
      case 5: return 'Edu Influencer';
      case 6: return 'Community Mentor';
      case 7: return 'Knowledge Magnet';
      case 8: return 'Master Educator';
      default: return 'Teaching Achievement';
    }
  }
  return 'Achievement';
};

export const getAchievementDescription = (type: string, value: number): string => {
  if (type === 'courses') {
    return `Created ${value} course${value !== 1 ? 's' : ''}`;
  } else if (type === 'students') {
    return `Reached ${value} student${value !== 1 ? 's' : ''}`;
  }
  return `Milestone: ${value}`;
};
