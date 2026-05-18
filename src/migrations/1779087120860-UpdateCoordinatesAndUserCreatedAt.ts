import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCoordinatesAndUserCreatedAt1779087120860 implements MigrationInterface {
    name = 'UpdateCoordinatesAndUserCreatedAt1779087120860'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "business" ALTER COLUMN "latitude" TYPE numeric(11,8)`);
        await queryRunner.query(`ALTER TABLE "business" ALTER COLUMN "longitude" TYPE numeric(11,8)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business" ALTER COLUMN "longitude" TYPE numeric(10,7)`);
        await queryRunner.query(`ALTER TABLE "business" ALTER COLUMN "latitude" TYPE numeric(10,7)`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "createdAt"`);
    }

}
