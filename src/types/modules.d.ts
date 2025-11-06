// Type declarations to resolve module resolution errors
// These are temporary until node_modules is properly installed

declare module 'react' {
  export * from 'react/index';
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: React.DependencyList): void;
  export function useMemo<T>(factory: () => T, deps: React.DependencyList): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T;
  export function useRef<T>(initialValue: T): React.MutableRefObject<T>;
  export function useTransition(): [boolean, (callback: () => void) => void];
  export namespace React {
    type DependencyList = ReadonlyArray<any>;
    interface MutableRefObject<T> {
      current: T;
    }
  }
}

declare module 'react-dom' {
  export * from 'react-dom/index';
}

declare module 'next/navigation' {
  export function useRouter(): any;
  export function usePathname(): string;
  export function useParams(): any;
  export function notFound(): never;
  export function redirect(url: string): never;
}

declare module 'firebase/firestore' {
  export function collection(db: any, path: string, ...pathSegments: string[]): any;
  export function doc(db: any, path: string, ...pathSegments: string[]): any;
  export function getDoc(ref: any): Promise<any>;
  export function getDocs(query: any): Promise<any>;
  export function addDoc(ref: any, data: any): Promise<any>;
  export function updateDoc(ref: any, data: any): Promise<any>;
  export function deleteDoc(ref: any): Promise<any>;
  export function query(ref: any, ...constraints: any[]): any;
  export function where(field: string, op: string, value: any): any;
  export function orderBy(field: string, direction?: 'asc' | 'desc'): any;
  export function limit(count: number): any;
  export function serverTimestamp(): any;
  export function arrayUnion(...elements: any[]): any;
  export function arrayRemove(...elements: any[]): any;
  export function increment(n: number): any;
  export function writeBatch(db: any): any;
  export function setDoc(ref: any, data: any, options?: any): Promise<any>;
  export function onSnapshot(ref: any, callback: any): () => void;
  export type DocumentReference<T = any> = any;
  export type Query<T = any> = any;
  export type Timestamp = any;
}

declare module 'lucide-react' {
  export const Circle: any;
  export const Send: any;
  export const Paperclip: any;
  export const Check: any;
  export const CheckCheck: any;
  export const Camera: any;
  export const MessageSquare: any;
  export const Bell: any;
  export const UserPlus: any;
  export const Award: any;
  export const Heart: any;
  export const BookOpen: any;
  export const CheckCircle: any;
  export const MessageCircle: any;
  export const Target: any;
  export const TrendingUp: any;
  export const Sparkles: any;
  export const Users: any;
  export const PlusCircle: any;
  export const Star: any;
  export const Download: any;
  export const Coins: any;
  export const FileText: any;
  export const Video: any;
  export const Brain: any;
  export const Zap: any;
  export const Settings: any;
  export const Shield: any;
  export const LayoutGrid: any;
  export const Home: any;
  export const GraduationCap: any;
  export const Book: any;
  export const Users2: any;
  export const MessageSquare2: any;
  export const Trophy: any;
  export const Store: any;
  export const Gamepad2: any;
  export const Search: any;
  export const UserCheck: any;
  export const User: any;
  export const X: any;
  export const Loader2: any;
  export const ShoppingBag: any;
  export const School: any;
  export function createLucideIcon(name: string, svgPath: string): any;
}

declare module 'date-fns' {
  export function format(date: Date | number, formatStr: string): string;
  export function formatDistanceToNow(date: Date | number, options?: any): string;
  export function formatDistanceToNowStrict(date: Date | number, options?: any): string;
  export function formatDistance(date: Date | number, dateToCompare: Date | number, options?: any): string;
}

declare module 'zod' {
  export * from 'zod/index';
}

declare module '@hookform/resolvers' {
  export * from '@hookform/resolvers/index';
}

