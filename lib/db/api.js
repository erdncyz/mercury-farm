import AllModel from './models/all/index.js';
import GroupModel from './models/group/index.js';
import TeamModel from './models/team/index.js';
import UserModel from './models/user/index.js';
import DeviceModel from './models/device/index.js';
const concatModels = (...models) => Object.assign({}, ...models);
/**
 * @deprecated
 * Use specific model as a named export.
 */
export default concatModels(AllModel, GroupModel, TeamModel, UserModel, DeviceModel);
