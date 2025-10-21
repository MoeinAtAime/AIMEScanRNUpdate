// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { SDK, UserData } = initSchema(schema);

export {
  SDK,
  UserData
};