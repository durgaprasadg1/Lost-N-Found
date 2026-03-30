import { FirestoreModel } from "@/lib/firestoreModel";

class Admin extends FirestoreModel {}
Admin.collectionName = "admins";

export default Admin;
