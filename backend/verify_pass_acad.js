const bcrypt = require('bcrypt');
const password = 'Direction2025!';
const hash = '$2b$10$CzE4WXt0d3gAo0lLh1rwvOfyut49u/Io7VLc8J1fR7xf.MnNQpgji';

bcrypt.compare(password, hash).then(match => {
    console.log('Match ACAD:', match);
    process.exit(0);
});
