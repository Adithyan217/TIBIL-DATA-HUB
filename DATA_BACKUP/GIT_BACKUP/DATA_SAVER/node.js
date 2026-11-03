const SECRET_KEY = Buffer.from('k92ldahavl97s428vxri7x89seoy79sm', 'utf-8');
const INIT_VECTOR = Buffer.from('7dzhcnrb0016hmj3', 'utf-8');

const decryptData = (data) => {
    const encryptedData = Buffer.from(data, 'base64');
    const authTag = encryptedData.slice(encryptedData.length - 16);
    const encryptedText = encryptedData.slice(0, encryptedData.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, INIT_VECTOR);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
};

console.log(decryptData("9xP6srNVo71RfeohUAFucifhDobmabt/R0IFUXqa/J7igj1L4C9swb9FEY1mCZfRL9LO34eVXP0/qTunfia8MEhk53GXtiOk1G8yyasM5s50A2YX0pNr7byPwOdEogsmAwGXvmjcYStnVOGhLiWIcIR+S7b69gylyCQ74drg/xLtKr6DqLkedVXXTXZO/tw536u5VV8UwS/uZSgRrDstYRCX1NPVoIiHe+7dY1D1A86pYYrxyHZgYPu3hl8vPVcfehAnT6qD7nWMeHbkXpZewhRs1GM="))
// consolest.log('Decryption',symDecryptor("VSpRJvOvM3jt3hOWqwcqEvVkOnYfB+6qt+aLNS5IilDfoqlEVGk1HHQ5gJGLABN825aFBoCndHcESjhZ2CNAKNg0wSlbVm7Mjhzd5Jo3lHjSMyK1mpbifwNi1lnurJOTp27xIORhATXD3tgTLXJizehLjo1boYSpHzlspH4kvbZhEKO8QMHujtZk5k1eAsBCKbzKxUjIh8MxmhyWylwICrJHuOY+yfad5LU="));
