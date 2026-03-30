import { db } from "@/lib/firebaseAdmin";

function normalizeTimestamps(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (obj.toDate) return obj.toDate();
  if (Array.isArray(obj)) return obj.map(normalizeTimestamps);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = normalizeTimestamps(v);
  }
  return out;
}

function pickFields(obj, select) {
  if (!select) return obj;
  const fields = select.split(/\s+/).filter(Boolean);
  const picked = {};
  for (const f of fields) picked[f] = obj[f];
  return picked;
}

function applyUpdate(data, update) {
  const next = { ...data };
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      next[k] = (next[k] ?? 0) + v;
    }
  }
  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      next[k] = v;
    }
  }
  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      const arr = Array.isArray(next[k]) ? next[k] : [];
      arr.push(v);
      next[k] = arr;
    }
  }
  if (update.$pull) {
    for (const [k, v] of Object.entries(update.$pull)) {
      const arr = Array.isArray(next[k]) ? next[k] : [];
      next[k] = arr.filter((item) => item !== v);
    }
  }
  for (const [k, v] of Object.entries(update)) {
    if (k.startsWith("$")) continue;
    next[k] = v;
  }
  next.updatedAt = new Date();
  return next;
}

class FirestoreQuery {
  constructor(model, filters = {}) {
    this.model = model;
    this.filters = filters;
    this.order = null;
    this.populateConfig = null;
  }

  sort(orderObj) {
    this.order = orderObj;
    return this;
  }

  populate(field, select) {
    this.populateConfig = { field, select };
    return this;
  }

  lean() {
    return this.exec();
  }

  async exec() {
    let queryRef = this.model.collection();
    for (const [field, value] of Object.entries(this.filters)) {
      queryRef = queryRef.where(field, "==", value);
    }
    const snapshot = await queryRef.get();
    let docs = snapshot.docs.map((doc) => {
      const data = normalizeTimestamps(doc.data());
      return { ...data, _id: doc.id };
    });

    if (this.order) {
      const [[field, direction]] = Object.entries(this.order);
      docs.sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        if (av === bv) return 0;
        const mul = direction === -1 ? -1 : 1;
        return av > bv ? mul : -mul;
      });
    }

    if (this.populateConfig?.field) {
      const field = this.populateConfig.field;
      const ids = docs
        .map((d) => d[field])
        .filter(Boolean)
        .map((id) => id.toString());
      const uniqueIds = [...new Set(ids)];
      const relatedDocs = await Promise.all(
        uniqueIds.map(async (id) => {
          const ref = db.collection("users").doc(id);
          const snap = await ref.get();
          if (!snap.exists) return null;
          const data = normalizeTimestamps(snap.data());
          return { id, data };
        })
      );
      const relatedMap = new Map();
      for (const entry of relatedDocs) {
        if (entry) relatedMap.set(entry.id, entry.data);
      }
      docs = docs.map((d) => {
        const id = d[field]?.toString();
        if (relatedMap.has(id)) {
          d[field] = pickFields(
            { ...relatedMap.get(id), _id: id },
            this.populateConfig.select
          );
        }
        return d;
      });
    }

    docs = docs.map((d) => this.model.attachSave(d));
    return docs;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

export class FirestoreModel {
  static collectionName = "";

  static collection() {
    return db.collection(this.collectionName);
  }

  static attachSave(data) {
    const { _id, ...rest } = data;
    const docRef = this.collection().doc(_id);
    const wrapped = { ...data };
    Object.defineProperty(wrapped, "save", {
      enumerable: false,
      value: async () => {
        const toSave = { ...rest, updatedAt: new Date() };
        await docRef.set(toSave, { merge: true });
        return { ...wrapped, ...toSave };
      },
    });
    return wrapped;
  }

  static async create(data) {
    const now = new Date();
    const payload = {
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    };
    const docRef = await this.collection().add(payload);
    return this.attachSave({ ...payload, _id: docRef.id });
  }

  static find(filters = {}) {
    return new FirestoreQuery(this, filters);
  }

  static async findOne(filters = {}) {
    const docs = await this.find(filters).exec();
    return docs[0] ?? null;
  }

  static async findById(id) {
    const snap = await this.collection().doc(id).get();
    if (!snap.exists) return null;
    const data = normalizeTimestamps(snap.data());
    return this.attachSave({ ...data, _id: snap.id });
  }

  static async findByIdAndUpdate(id, update, options = { new: true }) {
    const snap = await this.collection().doc(id).get();
    if (!snap.exists) return null;
    const data = normalizeTimestamps(snap.data());
    const next = applyUpdate({ ...data, _id: id }, update);
    await this.collection().doc(id).set(next, { merge: true });
    return options.new ? this.attachSave(next) : this.attachSave(data);
  }

  static async findByIdAndDelete(id) {
    const doc = await this.findById(id);
    if (!doc) return null;
    await this.collection().doc(id).delete();
    return doc;
  }

  static async deleteMany(filters = {}) {
    const docs = await this.find(filters).exec();
    const batch = db.batch();
    docs.forEach((doc) => {
      batch.delete(this.collection().doc(doc._id));
    });
    await batch.commit();
    return { deletedCount: docs.length };
  }

  static async countDocuments(filters = {}) {
    const docs = await this.find(filters).exec();
    return docs.length;
  }
}
