import * as React from 'react';
import {
  Tailwind,
  Text,
  Heading,
  Html,
  Container,
  Font,
  Head,
  Hr,
  Row,
  Column,
  Img,
} from "@react-email/components";
import {formatDateWithSuffix } from '../utils/date.utils'
import { ProductOrderResponseType } from '@schemas/mongo/order.schema';
import { VendorType } from '@schemas/mongo/vendors.schema';

type PurchaseOrderEmailProps = {
  orderVendorId: VendorType;
  orderProducts: ProductOrderResponseType[]
  orderSerialId: string;
  createdAt: string;
}

const PurchaseOrderEmail = ({
  orderSerialId,
  orderVendorId,
  orderProducts,
  createdAt,
}: PurchaseOrderEmailProps) => {

  const totalCost = orderProducts.reduce((acc, product) => acc + (product.productQuantity * product.productId.productUnitPrice), 0)

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
            Dear {orderVendorId.vendorCompanyName},
          </Text>
          <Text className="text-base text-gray-700 mb-6">
            Thank you for your continued partnership with VS Dental. We are
            reaching out regarding a recent order, for which we have generated a
            purchase order . Please find the details below:
          </Text>


          <Text className=" text-left text-xl font-semibold text-gray-700 mt-8 flex items-center ">
            #{orderSerialId}
            <b className="w-full text-sm font-normal text-gray-500 text-right">
              {formatDateWithSuffix(createdAt)}
            </b>
          </Text>


          <Row className="px-4 rounded-md bg-gray-100 py-2 w-full mb-4">
            <Column className="w-[50%] uppercase text-sm text-gray-500">
              Product
            </Column>
            <Column className="w-[20%] uppercase text-sm text-gray-500">
              QUANTITY
            </Column>
            <Column className="w-[15%] uppercase text-sm text-gray-500">
              PRICE
            </Column>
            <Column className="w-[15%] uppercase text-sm text-gray-500">
              SUB TOTAL
            </Column>
          </Row>
          {orderProducts.map((product, index) => {
            const {
              productName,
              productUnitPrice,
              productAvatar,
            } = product.productId
            const orderQuantity = product.productQuantity;
            const totalCost = product.productQuantity * productUnitPrice;
            return (
              <Text key={index}>
                <Row className="px-4 rounded-md bg-white py-2 w-full">
                  <Column className="w-[50%] text-sm flex  items-center gap-4 uppercase whitespace-nowrap">
                    <Img src={productAvatar} className="object-cover h-8 w-8" />
                    {productName}
                  </Column>
                  <Column className="w-[20%] text-sm">{orderQuantity}</Column>
                  <Column className="w-[15%] text-sm">₱{productUnitPrice.toLocaleString('en-US')}</Column>
                  <Column className="w-[15%] text-sm">₱{totalCost.toLocaleString('en-US')}</Column>
                </Row>
                <Hr />
              </Text>
            );
          })}

          <Text className="text-right text-lg text-gray-700 mt-4">
            Total:
            <b className="ml-2">
              ₱{totalCost.toLocaleString('en-US')}</b>
          </Text>

          <Text className=" text-base text-gray-700 text-start h-12">
            Should you have any questions, please feel free to reach out to us
            at <b>billing@vsdental.com</b>.
          </Text>

          <Text className="mt-12 text-base text-gray-700 text-start">
            Sincerely, <br />
            The VS Dental Team
          </Text>
          <Hr />

          <Text className="mt-4 text-sm text-gray-500 text-start">
            FF Paras Building, Jose Abad Santos Ave, San Fernando, 2000 Pampanga
          </Text>
        </Container>
      </Tailwind>
    </Html>
  );
};

export default PurchaseOrderEmail;
