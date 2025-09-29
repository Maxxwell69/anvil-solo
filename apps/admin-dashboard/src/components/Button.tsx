import React from 'react'
import { styled } from 'styled-components'

interface ButtonProps {
    bgColor: string;
    fgColor: string;
    borderRadius: string;
    fontSize: string,
    children: any;

}
const Button = ({ bgColor, fgColor, borderRadius, fontSize, children } : ButtonProps) => {
    return(
        <ButtonStyle className='br-12' type='button' bgColor={bgColor} fgColor={fgColor} borderRadius={borderRadius} fontSize={fontSize}>
            {children}
        </ButtonStyle>
    )
}

const ButtonStyle = styled.button<{ bgColor: string, fgColor: string, borderRadius: string, fontSize: string }>`
    display: flex;
    padding: 5px 15px;
    border-radius: ${(props) => props.borderRadius};
    background-color: ${(props) => props.bgColor};
    color: ${(props) => props.fgColor};
    font-size: ${(props) => props.fontSize};
`
export default Button;