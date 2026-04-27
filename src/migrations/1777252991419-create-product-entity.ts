import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductEntity1777252991419 implements MigrationInterface {
    name = 'CreateProductEntity1777252991419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product" ("id_product" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "image" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id_business" integer, CONSTRAINT "PK_c8e2cf92d09d65c583fad34341c" PRIMARY KEY ("id_product"))`);
        await queryRunner.query(`ALTER TABLE "perfil" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "perfil" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "perfil" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "perfil" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_da2a0886bf6bd7bc78a4c672893" FOREIGN KEY ("id_business") REFERENCES "business"("id_business") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_da2a0886bf6bd7bc78a4c672893"`);
        await queryRunner.query(`ALTER TABLE "perfil" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "perfil" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "perfil" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "perfil" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP TABLE "product"`);
    }

}
