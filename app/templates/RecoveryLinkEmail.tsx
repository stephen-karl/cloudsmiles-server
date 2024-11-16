import * as React from "react";
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

type RecoveryLinkEmailProps = {
  firstName: string;
  link: string;
};

const RecoveryLinkEmail = ({ firstName, link }: RecoveryLinkEmailProps) => {
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
        <Container className="max-w-3xl mx-auto p-6 bg-white">
          <Heading className="text-center mb-6 flex items-center justify-center w-full">
            <Text className="ml-2 text-4xl text-lime-500 tracking-tighter font-bold">
              VS
            </Text>
            <Text className="ml-2 text-4xl text-green-950 tracking-tighter font-bold">
              Dental
            </Text>
          </Heading>
          <Text className="text-xl font-semibold text-gray-700 mb-4">
            Hello {firstName},
          </Text>
          <Text className="text-base text-gray-700 mb-6">
            We received a request to reset the password for your VS Dental
            account. To proceed, please click the button below to securely reset
            your password:
          </Text>

          <Container className="text-center my-12">
            <Link
              href={link}
              className="text-white text-base font-medium bg-lime-500 py-3 px-6 rounded-md hover:bg-lime-600"
            >
              Reset Password
            </Link>
          </Container>

          <Text className="text-base text-gray-700 mb-6">
            If you did not request a password reset, you can safely ignore this
            email. Your password will remain the same.
          </Text>

          <Text className="mt-4 text-base text-gray-700">
            If you have any questions, feel free to contact our support team at{" "}
            <b>support@vsdental.com</b>.
          </Text>

          <Text className="mt-12 text-base text-gray-700">
            Best regards, <br />
            The VS Dental Team
          </Text>
          <Hr />

          <Text className="mt-4 text-sm text-gray-500">
            FF Paras Building, Jose Abad Santos cor MacArthur Hwy, San Fernando,
            2000 Pampanga
          </Text>
        </Container>
      </Tailwind>
    </Html>
  );
};

export default RecoveryLinkEmail;
