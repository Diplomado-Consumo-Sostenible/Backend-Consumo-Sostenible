import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusinessProductFields1778532905804 implements MigrationInterface {
  name = 'AddBusinessProductFields1778532905804';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" ADD "price" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "business" ADD "legal_document_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business" ADD "is_legally_verified" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business" DROP COLUMN "is_legally_verified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business" DROP COLUMN "legal_document_url"`,
    );
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "price"`);
  }
}
