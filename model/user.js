import { FirestoreModel } from "@/lib/firestoreModel";

class User extends FirestoreModel {}
User.collectionName = "users";

export default User;
