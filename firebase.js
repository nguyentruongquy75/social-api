const admin = require("firebase-admin");

// Initialize firebase admin SDK
admin.initializeApp({
  credential: admin.credential.cert("./serviceAccount.json"),
  storageBucket: "social-1eff4.appspot.com",
});
// Cloud storage
const bucket = admin.storage().bucket();

const uploadFile = async (file) => {
  let resolveFn = null;
  const promise = new Promise((resolve) => {
    resolveFn = resolve;
  });
  const fileName = Date.now() + file.originalname;
  const blob = bucket.file(fileName);

  const blobWriter = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
    public: true,
  });

  blobWriter.on("error", (err) => {
    console.log(err);
  });

  blobWriter.on("finish", () => {
    const url = `https://firebasestorage.googleapis.com/v0/b/social-1eff4.appspot.com/o/${fileName}?alt=media&token`;

    resolveFn(url);
  });

  blobWriter.end(file.buffer);

  return promise;
};

const deleteFile = (fileName) => {
  bucket.file(fileName).delete();
};

module.exports = {
  uploadFile,
  deleteFile,
};
