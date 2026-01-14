const bcrypt = require('bcrypt');
const password = 'BAT95162';
const hash = '$2b$10$7M1aZKo/4lI8cIO7HDvSouKGptFFOYs2GFhfJgzZPTrQHC0xGriY6';

bcrypt.compare(password, hash).then(match => {
    console.log('Match:', match);
    process.exit(0);
});
