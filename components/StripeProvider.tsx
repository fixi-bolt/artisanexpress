import { Platform } from 'react-native';

export const StripeProvider = Platform.select({
  web: require('./StripeProvider.web').StripeProvider,
  default: require('./StripeProvider.native').StripeProvider,
});
