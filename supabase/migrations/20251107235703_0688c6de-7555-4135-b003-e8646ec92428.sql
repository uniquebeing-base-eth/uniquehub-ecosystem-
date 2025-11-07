-- Delete all test courses to reset for testing
DELETE FROM courses WHERE id IN (
  '0422be75-5c42-4c3c-8472-be051640850a',
  '2db7bbff-58ff-4047-b685-6165364f2b6e',
  '208f916b-b777-4b90-8309-a298a0fa6c6c',
  '38291f3d-de52-4d0a-b1f4-58c53538f1e8'
);