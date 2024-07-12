import Joi from "joi";

// nerPayload validator
export const nerPayloadValidator = (payload) => {
  const schema = Joi.object()
    .keys({
      uid: Joi.number().required(),
      chatId: Joi.string().required(),
      sessionId: Joi.string().required(),
    })
    .unknown(true);
  return schema.validate(payload);
};
