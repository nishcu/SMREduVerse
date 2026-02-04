//Copied from https://github.com/FirebaseExtended/reactfire/blob/main/src/firestore/sources.ts
import {
  onSnapshot,
  getDoc,
  getDocs,
  type DocumentReference,
  type DocumentData,
  type Query,
  type Firestore,
  type CollectionReference,
  type DocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';

export const onSnapshotFromServer = <T = DocumentData>(
  ref: DocumentReference<T> | Query<T>,
  onNext: (snapshot: DocumentSnapshot<T> | QuerySnapshot<T>) => void,
  onError?: (error: Error) => void
) => onSnapshot(ref, { includeMetadataChanges: true }, (snapshot) => {
      if (!snapshot.metadata.fromCache) {
        onNext(snapshot as DocumentSnapshot<T> | QuerySnapshot<T>);
      }
    }, onError);

export const onSnapshotFromCache = <T = DocumentData>(
  ref: DocumentReference<T> | Query<T>,
  onNext: (snapshot: DocumentSnapshot<T> | QuerySnapshot<T>) => void,
  onError?: (error: Error) => void
) => onSnapshot(ref, { includeMetadataChanges: true }, (snapshot) => {
      if (snapshot.metadata.fromCache) {
        onNext(snapshot as DocumentSnapshot<T> | QuerySnapshot<T>);
      }
    }, onError);

export const getDocFromServer = <T = DocumentData>(
  ref: DocumentReference<T>
): Promise<DocumentSnapshot<T>> => getDoc(ref);

export const getDocFromCache = <T = DocumentData>(
  ref: DocumentReference<T>
): Promise<DocumentSnapshot<T>> => getDoc(ref);

export const getDocsFromServer = <T = DocumentData>(
  query: Query<T>
): Promise<QuerySnapshot<T>> => getDocs(query);

export const getDocsFromCache = <T = DocumentData>(
  query: Query<T>
): Promise<QuerySnapshot<T>> => getDocs(query);

export type GetSnapshotSource = 'server' | 'cache';
export type ListenSnapshotSource = 'listen' | 'server' | 'cache';
