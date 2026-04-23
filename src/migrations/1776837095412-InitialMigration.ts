import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1776837095412 implements MigrationInterface {
  name = 'InitialMigration1776837095412';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tag" ("id_tags" SERIAL NOT NULL, "tag" character varying NOT NULL, CONSTRAINT "PK_0e0aa3e594535eb5fc8a5d2d3a2" PRIMARY KEY ("id_tags"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "category" ("id_category" SERIAL NOT NULL, "category" character varying NOT NULL, CONSTRAINT "PK_9cfdf8d215b7072d300b9bbcafe" PRIMARY KEY ("id_category"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."business_status_enum" AS ENUM('Active', 'Pending', 'Rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "business" ("id_business" SERIAL NOT NULL, "businessName" character varying NOT NULL, "description" text NOT NULL, "logo" character varying, "images" text, "address" character varying NOT NULL, "latitude" numeric(10,7), "longitude" numeric(10,7), "phone" character varying, "emailBusiness" character varying, "website" character varying, "instagramUrl" character varying, "facebookUrl" character varying, "xUrl" character varying, "schedule" json, "status" "public"."business_status_enum" NOT NULL DEFAULT 'Pending', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userIdUsuario" integer, "categoryIdCategory" integer, CONSTRAINT "PK_526605da08b21d070aa5569015b" PRIMARY KEY ("id_business"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "genero" ("id_genero" SERIAL NOT NULL, "nombre" character varying(50) NOT NULL, CONSTRAINT "UQ_83cb13a7b0c5737bdfc8fe78111" UNIQUE ("nombre"), CONSTRAINT "PK_d0159c8f7ffb7f9a22b9bd553f6" PRIMARY KEY ("id_genero"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "perfil" ("id_perfil" SERIAL NOT NULL, "nombre" character varying(150), "foto_perfil" character varying(255), "isActive" boolean NOT NULL DEFAULT true, "id_usuario" integer, "id_genero" integer, CONSTRAINT "REL_4f728b134716ee028b716f84cd" UNIQUE ("id_usuario"), CONSTRAINT "PK_79181da5d8898aa87d57118dbf1" PRIMARY KEY ("id_perfil"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "rol" ("id" SERIAL NOT NULL, "nombre" character varying(50) NOT NULL, CONSTRAINT "PK_c93a22388638fac311781c7f2dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id_usuario" SERIAL NOT NULL, "email" character varying(100) NOT NULL, "password" character varying(255) NOT NULL, "passwordResetOTP" character varying, "passwordResetExpires" TIMESTAMP, "passwordResetAttempts" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "rolId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_c5cc9eb1de424051b6c79c3307c" PRIMARY KEY ("id_usuario"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "business_tags_tag" ("businessIdBusiness" integer NOT NULL, "tagIdTags" integer NOT NULL, CONSTRAINT "PK_b7eaa4f281941db8f5d1ca8d627" PRIMARY KEY ("businessIdBusiness", "tagIdTags"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8509c9ce767c5ff59b5e7af467" ON "business_tags_tag" ("businessIdBusiness") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f341de93753334a888bcc86a2" ON "business_tags_tag" ("tagIdTags") `,
    );
    await queryRunner.query(
      `ALTER TABLE "business" ADD CONSTRAINT "FK_aba0b45f2c0dd908034b69733ba" FOREIGN KEY ("userIdUsuario") REFERENCES "user"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business" ADD CONSTRAINT "FK_487d281ccd7455cfddeff6cf2ff" FOREIGN KEY ("categoryIdCategory") REFERENCES "category"("id_category") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "perfil" ADD CONSTRAINT "FK_4f728b134716ee028b716f84cdf" FOREIGN KEY ("id_usuario") REFERENCES "user"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "perfil" ADD CONSTRAINT "FK_e9375f7dcc1804559b2c405abc9" FOREIGN KEY ("id_genero") REFERENCES "genero"("id_genero") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_f66058a8f024b32ce70e0d6a929" FOREIGN KEY ("rolId") REFERENCES "rol"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_tags_tag" ADD CONSTRAINT "FK_8509c9ce767c5ff59b5e7af467d" FOREIGN KEY ("businessIdBusiness") REFERENCES "business"("id_business") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_tags_tag" ADD CONSTRAINT "FK_3f341de93753334a888bcc86a21" FOREIGN KEY ("tagIdTags") REFERENCES "tag"("id_tags") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_tags_tag" DROP CONSTRAINT "FK_3f341de93753334a888bcc86a21"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_tags_tag" DROP CONSTRAINT "FK_8509c9ce767c5ff59b5e7af467d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_f66058a8f024b32ce70e0d6a929"`,
    );
    await queryRunner.query(
      `ALTER TABLE "perfil" DROP CONSTRAINT "FK_e9375f7dcc1804559b2c405abc9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "perfil" DROP CONSTRAINT "FK_4f728b134716ee028b716f84cdf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business" DROP CONSTRAINT "FK_487d281ccd7455cfddeff6cf2ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business" DROP CONSTRAINT "FK_aba0b45f2c0dd908034b69733ba"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f341de93753334a888bcc86a2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8509c9ce767c5ff59b5e7af467"`,
    );
    await queryRunner.query(`DROP TABLE "business_tags_tag"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "rol"`);
    await queryRunner.query(`DROP TABLE "perfil"`);
    await queryRunner.query(`DROP TABLE "genero"`);
    await queryRunner.query(`DROP TABLE "business"`);
    await queryRunner.query(`DROP TYPE "public"."business_status_enum"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP TABLE "tag"`);
  }
}
