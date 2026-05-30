import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDeletedByOwnerBusiness1779931303443 implements MigrationInterface {
    name = 'AddIsDeletedByOwnerBusiness1779931303443'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business" ADD "isDeletedByOwner" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business" DROP COLUMN "isDeletedByOwner"`);
    }

}
