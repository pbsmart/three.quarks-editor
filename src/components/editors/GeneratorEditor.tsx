import * as React from "react";
import {FunctionValueGenerator, ValueGenerator} from "three.quarks";
import {ColorGenerator, ConstantColor, FunctionColorGenerator, AxisAngleGenerator, RandomQuatGenerator, RotationGenerator} from "three.quarks";
import {ConstantValue} from "three.quarks";
import {Vector3, Vector4} from "three";
import {IntervalValue} from "three.quarks";
import {PiecewiseBezier} from "three.quarks";
import {ColorRange} from "three.quarks";
import {RandomColor} from "three.quarks";
import {Gradient} from "three.quarks";
import {NumberInput} from "./NumberInput";
import {ColorEditor} from "./ColorEditor";
import "./GeneratorEditor.scss";
import {BezierCurvesEditor} from "./bezier/BezierCurvesEditor";
import {Typography} from "@mui/material";
import {SelectInput} from "./SelectInput";
import {BezierCurvesViewer} from "./bezier/BezierCurvesViewer";
import {GradientEditor} from "./GradientEditor";
import {Vector3Editor} from "./Vector3Editor";

type EditorType =
    'constant'
    | 'intervalValue'
    | 'piecewiseBezier'
    | 'color'
    | 'randomColor'
    | 'colorRange'
    | 'gradient'
    | 'vec3'
    | 'randomQuat'
    | 'axisAngle';
export type ValueType = 'value' | 'valueFunc' | 'color' | 'colorFunc' | 'vec3' | 'rotationFunc';

const ValueToEditor: { [a: string]: Array<EditorType> } = {
    'value': ['constant', 'intervalValue'],
    'valueFunc': ['piecewiseBezier'],
    'color': ['color', 'randomColor'],
    'colorFunc': ['colorRange', 'gradient'],
    'rotationFunc': ['randomQuat', 'axisAngle'],
    'vec3': ['vec3'],
};

export type GenericGenerator = ValueGenerator | FunctionValueGenerator | ColorGenerator | FunctionColorGenerator | RotationGenerator;

interface GeneratorEditorProps {
    allowedType: Array<ValueType>;
    name: string;
    value: GenericGenerator;
    onChange: (generator: GenericGenerator) => void;
}

interface GeneratorEditorState {
    open: boolean;
}

export class GeneratorEditor extends React.PureComponent<GeneratorEditorProps, GeneratorEditorState> {

    constructor(props: Readonly<GeneratorEditorProps>) {
        super(props);
        const currentEditor = ValueToEditor[props.allowedType[0]][0];
        this.state = {
            open: false,
        }
    }
    changeEditor = (value: string) => {
        const editorType = value;
        let generator: GenericGenerator | null = null;
        switch(editorType) {
            case "constant":
                generator = new ConstantValue(0);
                break;
            case "color":
                generator = new ConstantColor(new Vector4(1,1,1,1));
                break;
            case "intervalValue":
                generator = new IntervalValue(0, 1);
                break;
            case "colorRange":
                generator = new ColorRange(new Vector4(0,0,0,1), new Vector4(1,1,1,1));
                break;
            case "randomColor":
                generator = new RandomColor(new Vector4(0,0,0,1), new Vector4(1,1,1,1));
                break;
            case "gradient":
                generator = new Gradient([[new ColorRange(new Vector4(0,0,0,1), new Vector4(1,1,1,1)), 0],
                    [new ColorRange(new Vector4(1,1,1,1), new Vector4(1,1,1,1)), 1]]);
                break;
            case "piecewiseBezier":
                generator = new PiecewiseBezier();
                break;
            case "randomQuat":
                generator = new RandomQuatGenerator();
                break;
            case "axisAngle":
                generator = new AxisAngleGenerator(new Vector3(0, 1, 0), new ConstantValue(Math.PI / 2));
                break;
        }
        if (generator)
            this.props.onChange(generator);
    }

    changeValue = (x: number) => {
        this.props.onChange(new ConstantValue(x));
    };

    changeColor = (x: Vector4) => {
        this.props.onChange(new ConstantColor(x));
    };

    changeValueA = (x: number) => {
        const interval = this.props.value as IntervalValue;
        this.props.onChange(new IntervalValue(x, interval.b));
    };

    changeValueB = (x: number) => {
        const interval = this.props.value as IntervalValue;
        this.props.onChange(new IntervalValue(interval.a, x));
    };

    changeColorRangeA = (x: Vector4) => {
        const colorRange = this.props.value as ColorRange;
        this.props.onChange(new ColorRange(x, colorRange.b));
    };
    changeColorRangeB = (x: Vector4) => {
        const colorRange = this.props.value as ColorRange;
        this.props.onChange(new ColorRange(colorRange.a, x));
    };
    changeRandomColorA = (x: Vector4) => {
        const randomColor = this.props.value as RandomColor;
        this.props.onChange(new RandomColor(x, randomColor.b));
    };
    changeRandomColorB = (x: Vector4) => {
        const randomColor = this.props.value as RandomColor;
        this.props.onChange(new RandomColor(randomColor.a, x));
    };
    changeGradient = (x: Gradient) => {
        this.props.onChange(x);
    }
    changeCurve = (x: PiecewiseBezier) => {
        this.props.onChange(new PiecewiseBezier(x.functions));
    }
    changeAxis = (x: number, y: number, z: number) => {
        this.props.onChange(new AxisAngleGenerator(new Vector3(x, y, z), (this.props.value as AxisAngleGenerator).angle));
    }
    changeAngle = (x: GenericGenerator) => {
        this.props.onChange(new AxisAngleGenerator((this.props.value as AxisAngleGenerator).axis, x as ValueGenerator));
    }

    getEditorType(generator: GenericGenerator): EditorType {
        if (generator instanceof ConstantValue) {
            return 'constant';
        } else if (generator instanceof IntervalValue) {
            return 'intervalValue';
        } else if (generator instanceof PiecewiseBezier) {
            return 'piecewiseBezier';
        } else if (generator instanceof ConstantColor) {
            return 'color';
        } else if (generator instanceof RandomColor) {
            return 'randomColor';
        } else if (generator instanceof ColorRange) {
            return 'colorRange';
        } else if (generator instanceof Gradient) {
            return 'gradient';
        } else if (generator instanceof RandomQuatGenerator) {
            return 'randomQuat';
        } else if (generator instanceof AxisAngleGenerator) {
            return 'axisAngle';
        }
        return 'constant';
    }

    render() {
        //console.log('render GeneratorEditor');
        const {name, value, allowedType} = this.props;

        const editorTypes = [];
        for (const valueType of allowedType) {
            for (const editorType of ValueToEditor[valueType]) {
                editorTypes.push(editorType);
            }
        }

        const currentEditor = this.getEditorType(value);
        //console.log(currentEditor);

        let editor;
        let postEditor;
        switch (currentEditor) {
            case "constant":
                editor = <React.Fragment>
                    <NumberInput value={(value as ConstantValue).value}
                                 onChange={this.changeValue}/></React.Fragment>;
                break;
            case "color":
                editor = (<React.Fragment>
                    <ColorEditor color={(value as ConstantColor).color} onChange={this.changeColor}/>
                </React.Fragment>);
                break;
            case "intervalValue":
                editor = <React.Fragment>
                    <NumberInput variant="short" value={(value as IntervalValue).a}
                                 onChange={this.changeValueA}/>-
                    <NumberInput variant="short" value={(value as IntervalValue).b}
                                 onChange={this.changeValueB}/></React.Fragment>;
                break;
            case "piecewiseBezier":
                editor = <React.Fragment>
                    <BezierCurvesViewer height={40} width={240} value={(value as PiecewiseBezier)}
                                        onChange={this.changeCurve}/>
                </React.Fragment>;
                break;
            case "colorRange":
                editor = (<React.Fragment>
                    <ColorEditor color={(value as ColorRange).a} onChange={this.changeColorRangeA}/>-
                    <ColorEditor color={(value as ColorRange).b} onChange={this.changeColorRangeB}/>
                </React.Fragment>);
                break;
            case "randomColor":
                editor = (<React.Fragment>
                    <ColorEditor color={(value as RandomColor).a} onChange={this.changeRandomColorA}/>-
                    <ColorEditor color={(value as RandomColor).b} onChange={this.changeRandomColorB}/>
                </React.Fragment>);
                break;
            case "gradient":
                editor = (<GradientEditor gradient={(value as Gradient)} onChange={this.changeGradient}/>);
                break;
            case "randomQuat":
                editor = <div/>;
                break;
            case "axisAngle": {
                const vec3 = (value as AxisAngleGenerator).axis;
                postEditor = <>
                    <Vector3Editor name={"axis"} x={vec3.x} y={vec3.y} z={vec3.z} onChange={this.changeAxis}/>
                    <GeneratorEditor allowedType={['value', 'valueFunc']} name={"angle"} onChange={this.changeAngle}
                                     value={(value as AxisAngleGenerator).angle}/>
                </>;
                break;
            }
        }
        /*const content =
            <div className="property">
                <Typography component={"label"} className="name">{name}</Typography>
                {editor}
                <SelectInput onChange={this.changeEditor} value={currentEditor}
                             options={editorTypes} />
            </div>;*/
        if (postEditor) {
            return <div>
                <div className="property">
                    <Typography component={"label"} className="name">{name}</Typography>
                    {editor}
                    <SelectInput onChange={this.changeEditor} value={currentEditor}
                                 options={editorTypes.map(editorType => [editorType, editorType])} />
                </div>;
                {postEditor}
            </div>;
        } else
            return <div className="property">
                <Typography component={"label"} className="name">{name}</Typography>
                {editor}
                <SelectInput onChange={this.changeEditor} value={currentEditor}
                             options={editorTypes.map(editorType => [editorType, editorType])} />
            </div>;
    }
}
