import * as React from 'react';
import {
  Tailwind,
  Text,
  Heading,
  Html,
  Container,
  Font,
  Head,
  Link,
  Hr,
} from "@react-email/components";

type StaffWelcomeEmailProps = {
  firstName: string;
  email: string;
  password: string;
}


const StaffWelcomeEmail = ({ firstName, email, password }: StaffWelcomeEmailProps) => {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Tailwind>
        <Container className="max-w-3xl mx-auto p-6 bg-white ">
          <Heading className="text-center mb-6 flex items-center justify-center w-full">
            <Text className="ml-2 text-4xl text-lime-500 tracking-tighter font-bold">
              VS
            </Text>
            <Text className="ml-2 text-4xl text-green-950 tracking-tighter font-bold">
              Dental
            </Text>
          </Heading>
          <Text className="text-xl font-semibold text-gray-700 mb-4">
            Dear { " " + firstName},
          </Text>
          <Text className="text-base text-gray-700 mb-6">
            We're excited to have you join the VS Dental team! As part of your
            onboarding process, we've created an account for you in our system.
            Below, you'll find your login details:
          </Text>
          
          <Text className="text-gray-700 text-base bg-gray-100 rounded-md p-4 ">
            <b>Email:</b> {email} <br />
            <b>Password:</b> {password}
          </Text>

          <Text className="text-base text-gray-700 mb-6">
            Please log in to your account using the
            <Link
              href="https://example.com/login"
              className="text-green-950 font-medium hover:underline ml-1"
            >
              this link
            </Link>
            . Once logged in, you will have access to all the tools and
            resources needed to perform your duties effectively.
          </Text>

          <Text className="mt-4 text-base text-gray-700 text-start">
            If you have any questions or need assistance, don't hesitate to
            reach out to our support team at <b>support@vsdental.com</b>.
          </Text>

          <Text className="mt-12 text-base text-gray-700 text-start">
            Best regards, <br />
            The VS Dental Team
          </Text>
          <Hr className="" />

          <Text className="mt-4 text-sm text-gray-500 text-start">
            FF Paras Building Jose Abad Santos, cor MacArthur Hwy, San Fernando,
            2000 Pampanga
          </Text>
        </Container>
      </Tailwind>
    </Html>
  );
};

export default StaffWelcomeEmail
