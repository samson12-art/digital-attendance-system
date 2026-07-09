const app = require('./src/app');
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('  DIGITAL ATTENDANCE SYSTEM');
    console.log('========================================');
    console.log(`  Server running on port ${PORT}`);
    console.log(`  Login: http://localhost:${PORT}/login.html`);
    console.log(`  Register: http://localhost:${PORT}/register.html`);
    console.log(`  Admin: http://localhost:${PORT}/adminhome.html`);
    console.log(`  Teacher: http://localhost:${PORT}/teacherhome.html`);
    console.log('========================================\n');
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the existing server or run another port:`);
        console.error('  PORT=5002 node server.js');
        process.exit(1);
    }
    throw error;
});
