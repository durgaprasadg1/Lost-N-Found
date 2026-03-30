// Firestore uses persistent connections handled by the SDK; this is a no-op kept for backward compatibility.
export default async function dbConnect() {
  return true;
}
