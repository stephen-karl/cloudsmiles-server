import passport from 'passport';
import passportGoogle from 'passport-google-oauth20'
import passportApple from 'passport-apple'
import CredentialsModel from '../schemas/mongo/credential.schema';


const getUserByEmail = async (email: string) => {
  try {   
    const existingUser = await CredentialsModel.findOne({ email: email });
    return existingUser
  } catch (error) {
    throw "Error finding existing user"
  }
}

const addNewUser = async (clientId: string, email: string, provider:string) => {
  try {
    const newUser = await CredentialsModel.create({
      credentialClientId: clientId,
      credentialEmail: email,
      credentialProvider: provider,
      credentialRole: "patient",
    });
    return newUser
  } catch (error) {
    throw "Error creating new user"

  }
}

// apple

const GoogleStrategy = passportGoogle.Strategy;

export function useGoogleStrategy(){  
  passport.use(
    new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: '/auth/v1/google/callback',
    },
      async (accessToken, refreshToken, profile, done) => {
        try {
          if(!profile._json.email) throw "User does not have email";
          const existingUser = await getUserByEmail(profile._json.email);
          if (existingUser) { 
            done(null, existingUser);
          } else { 
            const newUser = await addNewUser( profile.id, profile._json.email, profile.provider )
            done(null, newUser);
          }
        } catch (err: any) {
          console.error(err)
          done(err)
        }
      }
    )
  );
  passport.serializeUser(function(user: Express.User, done) {
    done(null, user);
  });
    
  passport.deserializeUser(function(user: Express.User, done) {
    done(null, user);
  });
}
  