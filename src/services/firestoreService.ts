// src/services/firestoreService.ts
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db, isMockFirebase } from '../firebaseConfig';

export interface FridgeItem {
  id: string;
  name: string;
  qty: string;
}

export interface GroceryRequest {
  id: string;
  name: string;
  requestedBy: string;
  status: 'Pending' | 'Ordered';
}

// Local mock database in memory to simulate Firestore when keys are placeholders
let mockFridge: FridgeItem[] = [
  { id: '1', name: 'Spinach', qty: '1 bunch' },
  { id: '2', name: 'Eggs', qty: '6 pcs' },
  { id: '3', name: 'Tomato', qty: '4 pcs' },
];

let mockRequests: GroceryRequest[] = [
  { id: '1', name: 'Chicken', requestedBy: 'helper@quirkly.com', status: 'Pending' },
  { id: '2', name: 'Paneer (Cottage Cheese)', requestedBy: 'helper@quirkly.com', status: 'Pending' },
];

const listeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach(l => l());
};

export class FirestoreService {
  async saveUserRole(userId: string, email: string, role: 'Owner' | 'Helper'): Promise<void> {
    if (isMockFirebase) {
      console.log(`[Firestore Mock] Saved user ${email} with role ${role}`);
      return;
    }
    try {
      await setDoc(doc(db, 'users', userId), {
        email,
        role,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error saving user role:', e);
    }
  }

  listenToFridge(callback: (items: FridgeItem[]) => void): () => void {
    if (isMockFirebase) {
      callback([...mockFridge]);
      const handler = () => callback([...mockFridge]);
      listeners.add(handler);
      return () => {
        listeners.delete(handler);
      };
    }

    const q = query(collection(db, 'households/default_household/fridge'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const items: FridgeItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          name: data.name || '',
          qty: data.qty || '1 unit',
        });
      });
      callback(items);
    }, (error) => {
      console.error("Error listening to fridge stock:", error);
    });
  }

  async getFridgeItemsOnce(): Promise<FridgeItem[]> {
    if (isMockFirebase) {
      return [...mockFridge];
    }
    const q = query(collection(db, 'households/default_household/fridge'));
    const snapshot = await getDocs(q);
    const items: FridgeItem[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        name: data.name || '',
        qty: data.qty || '1 unit',
      });
    });
    return items;
  }

  async addFridgeItem(name: string, qty: string = '1 unit'): Promise<void> {
    if (isMockFirebase) {
      // Avoid duplicate names in mock list
      if (!mockFridge.some(i => i.name.toLowerCase() === name.toLowerCase())) {
        mockFridge.push({ id: Date.now().toString(), name, qty });
        notifyListeners();
      }
      return;
    }
    try {
      await addDoc(collection(db, 'households/default_household/fridge'), {
        name,
        qty,
        addedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error adding fridge item:', e);
    }
  }

  async deleteFridgeItem(itemId: string): Promise<void> {
    if (isMockFirebase) {
      mockFridge = mockFridge.filter(i => i.id !== itemId);
      notifyListeners();
      return;
    }
    try {
      await deleteDoc(doc(db, 'households/default_household/fridge', itemId));
    } catch (e) {
      console.error('Error deleting fridge item:', e);
    }
  }

  listenToGroceryRequests(callback: (requests: GroceryRequest[]) => void): () => void {
    if (isMockFirebase) {
      callback([...mockRequests]);
      const handler = () => callback([...mockRequests]);
      listeners.add(handler);
      return () => {
        listeners.delete(handler);
      };
    }

    const q = query(collection(db, 'households/default_household/requests'), orderBy('status', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const items: GroceryRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          name: data.name || '',
          requestedBy: data.requestedBy || 'unknown',
          status: data.status || 'Pending',
        });
      });
      callback(items);
    }, (error) => {
      console.error("Error listening to grocery requests:", error);
    });
  }

  async addGroceryRequest(name: string, requestedBy: string): Promise<void> {
    if (isMockFirebase) {
      if (!mockRequests.some(r => r.name.toLowerCase() === name.toLowerCase())) {
        mockRequests.push({
          id: Date.now().toString(),
          name,
          requestedBy,
          status: 'Pending',
        });
        notifyListeners();
      }
      return;
    }
    try {
      await addDoc(collection(db, 'households/default_household/requests'), {
        name,
        requestedBy,
        status: 'Pending',
        requestedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error adding grocery request:', e);
    }
  }

  async approveGroceryRequest(request: GroceryRequest): Promise<void> {
    if (isMockFirebase) {
      // Remove from mock requests, add to mock fridge
      mockRequests = mockRequests.filter(r => r.id !== request.id);
      if (!mockFridge.some(i => i.name.toLowerCase() === request.name.toLowerCase())) {
        mockFridge.push({
          id: Date.now().toString(),
          name: request.name,
          qty: '1 unit',
        });
      }
      notifyListeners();
      return;
    }
    try {
      // In Firestore, delete from requests collection and write to fridge collection
      await deleteDoc(doc(db, 'households/default_household/requests', request.id));
      await addDoc(collection(db, 'households/default_household/fridge'), {
        name: request.name,
        qty: '1 unit',
        addedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error approving grocery request:', e);
    }
  }

  async deleteGroceryRequest(requestId: string): Promise<void> {
    if (isMockFirebase) {
      mockRequests = mockRequests.filter(r => r.id !== requestId);
      notifyListeners();
      return;
    }
    try {
      await deleteDoc(doc(db, 'households/default_household/requests', requestId));
    } catch (e) {
      console.error('Error deleting grocery request:', e);
    }
  }
}
