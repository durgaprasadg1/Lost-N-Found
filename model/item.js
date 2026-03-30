import { FirestoreModel } from "@/lib/firestoreModel";

class Item extends FirestoreModel {}
Item.collectionName = "items";

export default Item;
