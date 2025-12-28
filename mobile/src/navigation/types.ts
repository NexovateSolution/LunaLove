import { NavigatorScreenParams } from '@react-navigation/native';
import { Match, PotentialMatch, User } from '../types';

export type RootStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Chat: { match: Match };
  ProfileDetail: { user: User | PotentialMatch };
  BuyCoins: undefined;
  Purchase: { type: 'subscription' | 'coins' };
  Earnings: undefined;
  BankAccountSetup: undefined;
  Settings: undefined;
  EditProfile: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Matches: undefined;
  Profile: undefined;
};

export type MatchesTabParamList = {
  MyMatches: undefined;
  PeopleILike: undefined;
  WhoLikesMe: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
