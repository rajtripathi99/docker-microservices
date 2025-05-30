/**
 * Entry point of the application
 * Starts the Express server on the specified port.
 */

import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
