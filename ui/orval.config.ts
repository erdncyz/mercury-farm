export default {
  mercury: {
    input: '../lib/units/api/swagger/api_v1.yaml',
    output: {
      schemas: 'src/generated/types',
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
}
