import assert from 'assert';
import { CustomNode, NumberNode, AddNode, SubtractNode, MultiplyNode, DivideNode, PlusNode, MinusNode, PowerNode } from '../nodes.js';
import { NumberValue } from '../values.js';
import { Interpreter } from '../interpreter.js';

describe('Interpreter', () => {
    it('should work with numbers', () => {
        const value = new Interpreter().visit(new NumberNode(51.2));
        assert.deepStrictEqual(value, new NumberValue(51.2));
    });

    it('should work with an addition', () => {
        const value = new Interpreter().visit(new AddNode(new NumberNode(27), new NumberNode(14)));
        assert.deepStrictEqual(value, new NumberValue(41));
    });

    it('should work with an subtract', () => {
        const value = new Interpreter().visit(new SubtractNode(new NumberNode(27), new NumberNode(14)));
        assert.deepStrictEqual(value, new NumberValue(13));
    });

    it('should work with a multiplication', () => {
        const value = new Interpreter().visit(new MultiplyNode(new NumberNode(27), new NumberNode(14)));
        assert.deepStrictEqual(value, new NumberValue(378));
    });

    it('should work with a power', () => {
        const value = new Interpreter().visit(new PowerNode(new NumberNode(10), new NumberNode(0)));
        assert.deepStrictEqual(value, new NumberValue(1));
    });

    it('should work with a divison', () => {
        const value = new Interpreter().visit(new DivideNode(new NumberNode(10), new NumberNode(5)));
        assert.deepStrictEqual(value, new NumberValue(2));
    });
    
    it('should raise an exception with division by 0', () => {
        try {
            const value = new Interpreter().visit(new DivideNode(new NumberNode(10), new NumberNode(0)));
        } catch(e) {
            assert.strictEqual(e.name, "Error");
        }
    });

    it('should work with a full expression', () => {
        const tree = new AddNode(new NumberNode(27),
            new MultiplyNode(
                new SubtractNode(
                    new DivideNode(
                        new NumberNode(10),
                        new NumberNode(2)
                    ),
                    new NumberNode(48)
                ),
                new NumberNode(51)
            )
        );

        const result = new Interpreter().visit(tree);
        assert.deepStrictEqual(result, new NumberValue(-2166));
    });
});
