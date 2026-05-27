import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFollowEntity1778186220366 implements MigrationInterface {
  name = 'CreateFollowEntity1778186220366';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "follow" ("id_follow" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "followerId" integer, "followedBusinessId" integer NOT NULL, CONSTRAINT "UQ_69690a0e9317860cce44f9d2f61" UNIQUE ("followerId", "followedBusinessId"), CONSTRAINT "PK_afb33461af04fc046c18f4e8ddf" PRIMARY KEY ("id_follow"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "business" ADD "followers_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow" ADD CONSTRAINT "FK_550dce89df9570f251b6af2665a" FOREIGN KEY ("followerId") REFERENCES "user"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow" ADD CONSTRAINT "FK_3b73c5e4c3207552fe8dc98cc24" FOREIGN KEY ("followedBusinessId") REFERENCES "business"("id_business") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "follow" DROP CONSTRAINT "FK_3b73c5e4c3207552fe8dc98cc24"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow" DROP CONSTRAINT "FK_550dce89df9570f251b6af2665a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business" DROP COLUMN "followers_count"`,
    );
    await queryRunner.query(`DROP TABLE "follow"`);
  }
}
