const { app } = require('electron');
const { setupAppLifecycle } = require('./app-lifecycle.cjs');

// Set the app name for clarity in logs and process managers
app.setName('ClaraVerse');

// Setup the application lifecycle events
setupAppLifecycle();