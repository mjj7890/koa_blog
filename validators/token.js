function tokenNotEmptyValidator(ctx) {
  ctx.validateBody('token')
    .required('不允许为空')
    .isString()
    .trim()
}
module.exports = {
  tokenNotEmptyValidator
}