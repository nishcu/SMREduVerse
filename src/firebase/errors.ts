
export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
    requestResourceData?: any;
    auth?: any;
  };
  
  export class FirestorePermissionError extends Error {
    context: SecurityRuleContext;
  
    constructor(context: SecurityRuleContext) {
      const { path, operation } = context;
      const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify({
          path,
          operation,
          ...context.auth && { auth: context.auth },
          ...context.requestResourceData && { resource: { data: context.requestResourceData } },
      }, null, 2)}`;
  
      super(message);
      this.name = 'FirestorePermissionError';
      this.context = context;
  
      // This is necessary for custom errors in TypeScript to be recognized as such.
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
  