

import React from 'react'
import styled from 'styled-components'

interface LoadingProps {
    fill?: string
    size?: number
}


export const QuoteLoadingElement = ({ fill, size }: LoadingProps) => (
    <QuoteLoading>
        <div className="loader2"></div>
    </QuoteLoading>
)

export const LoadingElement = ({ fill, size }: LoadingProps) => (
    <StyledLoading>
        <div className="loader"></div>
    </StyledLoading>

)

const Loading = (props: LoadingProps) => {
    return <PageLoading id="modal" className="modal" style={{ backdropFilter: 'blur(2px)' }} >
        <div className='d middle center'>
            <div className="loader"></div>
        </div>
    </PageLoading>

}

const StyledLoading = styled.div`
	> div {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
	}
        
	> :first-child {
		background-color: rgb(0,0,0,0.8);
		z-index: 9999;
	}
        
	> :last-child {
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		color: white;
	}
        
.loader {
  width: 50px;
  aspect-ratio: 1;
  --_c:no-repeat radial-gradient(farthest-side,#25b09b 92%,#0000);
  background: 
    var(--_c) top,
    var(--_c) left,
    var(--_c) right,
    var(--_c) bottom;
  background-size: 12px 12px;
  animation: l7 1s infinite;
}
@keyframes l7 {to{transform: rotate(.5turn)}}
`

const QuoteLoading = styled.div`
.loader2 {
  width: 15px;
  aspect-ratio: 1;
  border-radius: 50%;
  animation: l5 1s infinite linear alternate;
}
@keyframes l5 {
    0%  {box-shadow: 20px 0 #fff, -20px 0 #fff2;background: #fff }
    33% {box-shadow: 20px 0 #fff, -20px 0 #fff2;background: #fff2}
    66% {box-shadow: 20px 0 #fff2,-20px 0 #fff; background: #fff2}
    100%{box-shadow: 20px 0 #fff2,-20px 0 #fff; background: #fff }
}
`

const PageLoading = styled.div`
    position: fixed;
    top: 0;
    bottom: 0;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items:center;
    justify-content:center;

    div {
        .loader {
        width: 68px;
        aspect-ratio: 1;
        --_c:no-repeat radial-gradient(farthest-side,#50a0ff  92%,#0000);
        background: 
            var(--_c) top,
            var(--_c) left,
            var(--_c) right,
            var(--_c) bottom;
        background-size: 18px 18px;
        animation: l7 1s infinite;
        }
        @keyframes l7 {to{transform: rotate(.5turn)}}
    }
}
`
export default Loading