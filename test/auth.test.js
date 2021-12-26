const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server');

chai.use(chaiHttp);
chai.should();

describe("GET TOKEN FROM API", () => {
    describe("POST /auth/login", () => {
        it("should get token", (done) => {
            chai.request(app)
                .post('/auth/login')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
                });
        });
    })
});