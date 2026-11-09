export default {
  // Kuromoji decompresses dictionary files itself; browsers must receive the gzip bytes.
  server: { headers: { 'Content-Encoding': 'identity' } },
};
