import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBannerImageToBusiness1779042649398 implements MigrationInterface {
  name = 'AddBannerImageToBusiness1779042649398';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business" ADD "banner_image" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business" DROP COLUMN "banner_image"`,
    );
  }
}
